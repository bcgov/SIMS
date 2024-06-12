FROM artifacts.developer.gov.bc.ca/docker-remote/clamav:1.2
RUN freshclam
COPY "./../../scripts/docker-entrypoint-unprivileged.sh" "/init"
RUN chmod +x /init