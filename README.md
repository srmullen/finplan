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
- Warning/Error on projection page if any non-amortizing accounts hit zero. Warning on individual account page as well.
- Sorting/filtering on tables. Default sort on 'type' column.
- Pause schedules
- Show Remaining per month from In/Out calculation
