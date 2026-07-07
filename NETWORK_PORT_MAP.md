# Network Port Map

Status: planning map only.

## Local Ports

| Port | Service | Exposure policy |
| ---: | --- | --- |
| 3000 | Hermes UI or app preview | local only, Access route after approval |
| 5177 | Dev dashboard / Vibe HQ | local only, Access route after approval |
| 8443 | thClaws serve mode | bind `127.0.0.1`, Access route only |
| 8642 | Hermes gateway | local only, second auth gate |
| 8790 | Office Link / dev-control-api | local only, token required |
| 15672 | RabbitMQ management | local only, Access route only |
| 5672 | RabbitMQ AMQP | never public |
| 3306 | MySQL | never public |
| 6379 | Redis | never public |

## Private Hostname Plan

| Hostname | Local service | Protection |
| --- | --- | --- |
| `dev.sirinx.co` | `http://127.0.0.1:5177` | Cloudflare Access |
| `dashboard.dev.sirinx.co` | `http://127.0.0.1:5177` | Cloudflare Access |
| `office.dev.sirinx.co` | `http://127.0.0.1:8790` | Access plus token |
| `thclaws.dev.sirinx.co` | `http://127.0.0.1:8443` | Cloudflare Access |
| `hermes.dev.sirinx.co` | `http://127.0.0.1:3000` | Cloudflare Access |
| `hermes-api.dev.sirinx.co` | `http://127.0.0.1:8642` | Access plus app auth |
| `rabbitmq.dev.sirinx.co` | `http://127.0.0.1:15672` | Cloudflare Access |
| `ingest.dev.sirinx.co` | `http://127.0.0.1:8790` | Access plus token |

## Rule

The public website must never link to these private hostnames.
