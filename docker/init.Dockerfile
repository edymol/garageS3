# Tiny image that runs the demo cluster setup: Alpine + the static `garage`
# binary (copied from the official image) + our init script.
FROM dxflrs/garage:v2.2.0 AS garage

FROM alpine:3.20
COPY --from=garage /garage /usr/local/bin/garage
COPY docker/init.sh /init.sh
RUN chmod +x /init.sh
ENTRYPOINT ["/init.sh"]
