# BEST-SYSTEM backup container (WP-16, plan Sec. 11.4).
# Alpine + postgresql16-client + age + rsync + openssh-client.

FROM alpine:3.19

RUN apk add --no-cache \
    postgresql16-client \
    age \
    rsync \
    openssh-client \
    findutils \
    tzdata \
    dcron

WORKDIR /app

COPY backup.sh sync-spare.sh prune.sh entrypoint.sh ./
RUN chmod +x backup.sh sync-spare.sh prune.sh entrypoint.sh

# Run crond in foreground via entrypoint
ENTRYPOINT ["./entrypoint.sh"]
