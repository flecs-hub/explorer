FROM nginx:alpine

LABEL maintainer="sandermertens8@gmail.com"
LABEL version="1.0"
LABEL description="Flecs Explorer Frontend"

COPY etc /usr/share/nginx/html
