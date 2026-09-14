FROM intelliswarm-px4-sim:latest

# Install aiohttp for web server
RUN pip3 install --no-cache-dir aiohttp

WORKDIR /fruitdrone

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
