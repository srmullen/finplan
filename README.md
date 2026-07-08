finplan
=======

## Container Registry

Docker images are published to the GitHub Container Registry: https://github.com/srmullen/finplan/pkgs/container/finplan

```
docker pull ghcr.io/srmullen/finplan:latest
```

The image is private; log in first with a token that has `read:packages`:

```
docker login ghcr.io -u <github-username>
```

## TODO

- OpenAPI Spec
- Try ponytail
- Integration Tests required.
- Script for populating database
