# ---- build stage ----
FROM rust:1.80 AS builder
WORKDIR /app

# Cache deps
COPY Cargo.toml .
RUN mkdir src && echo "fn main(){}" > src/main.rs
RUN cargo build --release && rm -rf src

# Build
COPY . .
RUN cargo build --release

# ---- runtime stage ----
FROM debian:bookworm-slim
WORKDIR /app
RUN useradd -m appuser
COPY --from=builder /app/target/release/my-api /app/my-api
ENV RUST_LOG=info
EXPOSE 8000
USER appuser
CMD ["/app/my-api"]
