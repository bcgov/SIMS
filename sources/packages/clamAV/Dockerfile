FROM artifacts.developer.gov.bc.ca/docker-remote/clamav:1.2
RUN freshclam
# Copy the clamd.conf file into the container
COPY clamAV/clamd.conf /etc/clamav/clamd.conf
COPY "clamAV/scripts/docker-entrypoint-unprivileged.sh" "/init"
RUN chmod +x /init