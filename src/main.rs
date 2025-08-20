use axum::{
    extract::{Path, State},
    http::{HeaderValue, Method, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, env, net::SocketAddr, sync::Arc};
use thiserror::Error;
use tokio::sync::RwLock;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::{error, info};
use uuid::Uuid;

#[derive(Clone, Default)]
struct AppState {
    store: Arc<RwLock<HashMap<Uuid, User>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: Uuid,
    name: String,
    email: String,
}

#[derive(Debug, Deserialize)]
struct CreateUser {
    name: String,
    email: String,
}

#[derive(Debug, Error)]
enum ApiError {
    #[error("user not found")]
    NotFound,
    #[error("bad request: {0}")]
    BadRequest(String),
    #[error("internal server error")]
    Internal,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        let (status, msg) = match &self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),
            ApiError::BadRequest(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            ApiError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
        };
        let body = serde_json::json!({ "error": msg });
        (status, Json(body)).into_response()
    }
}

#[tokio::main]
async fn main() {
    println!("[DEBUG] Rust API server main() started");
    init_tracing();

    let state = AppState::default();

    // CORS: Open for dev. Tighten for prod.
    let cors = CorsLayer::new()
        .allow_origin("*".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([http::header::CONTENT_TYPE]);

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .nest(
            "/api/v1",
            Router::new()
                .route("/echo", post(echo))
                .route("/users", get(list_users).post(create_user))
                .route("/users/{id}", get(get_user)),
        )
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(cors);
// Root handler for '/'
async fn root() -> impl IntoResponse {
    "Welcome to my-api!"
}

    let port = env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(8000);
    let addr: SocketAddr = format!("0.0.0.0:{port}").parse().unwrap();
    info!("listening on http://{addr}");

    // Graceful shutdown on Ctrl+C
    let server = axum::serve(
        tokio::net::TcpListener::bind(addr).await.unwrap(),
        app.into_make_service(),
    )
    .with_graceful_shutdown(shutdown_signal());

    if let Err(e) = server.await {
        error!("server error: {e}");
    }
}

fn init_tracing() {
    let filter = std::env::var("RUST_LOG").unwrap_or_else(|_| "info,tower_http=info".into());
    tracing_subscriber::fmt().with_env_filter(filter).init();
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    info!("shutdown signal received");
}

async fn health() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn echo(Json(body): Json<serde_json::Value>) -> impl IntoResponse {
    Json(serde_json::json!({ "you_sent": body }))
}

async fn list_users(State(state): State<AppState>) -> Result<impl IntoResponse, ApiError> {
    let map = state.store.read().await;
    let mut users: Vec<User> = map.values().cloned().collect();
    users.sort_by_key(|u| u.name.clone());
    Ok(Json(users))
}

async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<impl IntoResponse, ApiError> {
    if payload.name.trim().is_empty() || payload.email.trim().is_empty() {
        return Err(ApiError::BadRequest("name and email are required".into()));
    }
    let user = User { id: Uuid::new_v4(), name: payload.name, email: payload.email };
    let mut map = state.store.write().await;
    map.insert(user.id, user.clone());
    Ok((StatusCode::CREATED, Json(user)))
}

async fn get_user(State(state): State<AppState>, Path(id): Path<String>) -> Result<impl IntoResponse, ApiError> {
    let Ok(uuid) = Uuid::parse_str(&id) else {
        return Err(ApiError::BadRequest("invalid UUID".into()));
    };
    let map = state.store.read().await;
    let Some(user) = map.get(&uuid) else {
        return Err(ApiError::NotFound);
    };
    Ok(Json(user.clone()))
}
