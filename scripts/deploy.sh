# Take down containers
docker-compose down

# Rebuild, add last commit hash as tag, and run containers from rebuilt images
TAG=$(git rev-parse --short HEAD) docker-compose up -d --build

# Prune dangling containers and images
docker container prune -f
docker image prune -f