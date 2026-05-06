<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## AI / API-Key

Die API-Konfiguration wird aus **backend/.env** geladen.

### Anthropic Claude

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=dein_key_hier

# Optional (Default)
CLAUDE_MODEL=claude-haiku-4-5-20251001
```

### Google Gemini

```env
AI_PROVIDER=gemini
GEMINI_PROJECT_ID=dein_google_cloud_project
GEMINI_LOCATION=us-central1
GEMINI_API_KEY=dein_vertex_api_key_hier

# Optional (Default)
GEMINI_MODEL=gemini-2.0-flash-001
```

Die Gemini-Anbindung nutzt das offizielle Google Gen AI SDK (`@google/genai`) fuer Vertex AI mit dem regionalen Endpunkt
`https://<location>-aiplatform.googleapis.com/v1/projects/<project>/locations/<location>/publishers/google/models/<model>:streamGenerateContent`.
Wenn `GEMINI_API_KEY` gesetzt ist, verwendet das Backend den regionalen Vertex-AI-REST-Endpunkt direkt mit diesem API-Key. Wenn `GEMINI_API_KEY` nicht gesetzt ist, verwendet das Backend weiterhin das offizielle Google Gen AI SDK (`@google/genai`) mit Google Application Default Credentials, z. B. aus `gcloud auth application-default login` oder `GOOGLE_APPLICATION_CREDENTIALS`.

Wenn `AI_PROVIDER` nicht gesetzt ist, verwendet das Backend `anthropic`.

## Statistik / MySQL

Die Nutzungsstatistik schreibt monatliche aggregierte Zähler in die MySQL-Tabelle `visitors`. Ohne vollständige MySQL-Konfiguration startet das Backend weiterhin; Statistik-Schreibzugriffe werden dann als No-Op behandelt.

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=dein_user
MYSQL_PASSWORD=dein_passwort
MYSQL_DATABASE=deine_datenbank

# Passwort fuer GET /api/stats/monthly und die /statistik-Seite
STATS_ADMIN_PASSWORD=langes_admin_passwort
```

Schema:

```sql
CREATE TABLE IF NOT EXISTS visitors (
  monthPrimary varchar(5) NOT NULL PRIMARY KEY,
  visitors int(11) NOT NULL DEFAULT 0,
  article_views int(11) NOT NULL DEFAULT 0,
  simplify_cefr_a1 int(11) NOT NULL DEFAULT 0,
  simplify_cefr_a2 int(11) NOT NULL DEFAULT 0,
  simplify_cefr_b1 int(11) NOT NULL DEFAULT 0,
  simplify_cefr_b2 int(11) NOT NULL DEFAULT 0,
  simplify_cefr_c1 int(11) NOT NULL DEFAULT 0,
  simplify_grade_1 int(11) NOT NULL DEFAULT 0,
  simplify_grade_2 int(11) NOT NULL DEFAULT 0,
  simplify_grade_3 int(11) NOT NULL DEFAULT 0,
  simplify_grade_4 int(11) NOT NULL DEFAULT 0,
  simplify_grade_5 int(11) NOT NULL DEFAULT 0,
  simplify_grade_6 int(11) NOT NULL DEFAULT 0,
  simplify_grade_7 int(11) NOT NULL DEFAULT 0,
  simplify_grade_8 int(11) NOT NULL DEFAULT 0,
  simplify_grade_9 int(11) NOT NULL DEFAULT 0,
  translations int(11) NOT NULL DEFAULT 0,
  chats int(11) NOT NULL DEFAULT 0,
  chat_questions int(11) NOT NULL DEFAULT 0,
  visits int(11) NOT NULL DEFAULT 0,
  pages int(11) NOT NULL DEFAULT 0
);
```

Falls die Tabelle bereits ohne die neuen Simplify- oder `translations`-Spalten existiert:

```sql
ALTER TABLE visitors ADD COLUMN simplify_cefr_a1 int(11) NOT NULL DEFAULT 0 AFTER article_views;
ALTER TABLE visitors ADD COLUMN simplify_cefr_a2 int(11) NOT NULL DEFAULT 0 AFTER simplify_cefr_a1;
ALTER TABLE visitors ADD COLUMN simplify_cefr_b1 int(11) NOT NULL DEFAULT 0 AFTER simplify_cefr_a2;
ALTER TABLE visitors ADD COLUMN simplify_cefr_b2 int(11) NOT NULL DEFAULT 0 AFTER simplify_cefr_b1;
ALTER TABLE visitors ADD COLUMN simplify_cefr_c1 int(11) NOT NULL DEFAULT 0 AFTER simplify_cefr_b2;
ALTER TABLE visitors ADD COLUMN simplify_grade_1 int(11) NOT NULL DEFAULT 0 AFTER simplify_cefr_c1;
ALTER TABLE visitors ADD COLUMN simplify_grade_2 int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_1;
ALTER TABLE visitors ADD COLUMN simplify_grade_3 int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_2;
ALTER TABLE visitors ADD COLUMN simplify_grade_4 int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_3;
ALTER TABLE visitors ADD COLUMN simplify_grade_5 int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_4;
ALTER TABLE visitors ADD COLUMN simplify_grade_6 int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_5;
ALTER TABLE visitors ADD COLUMN simplify_grade_7 int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_6;
ALTER TABLE visitors ADD COLUMN simplify_grade_8 int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_7;
ALTER TABLE visitors ADD COLUMN simplify_grade_9 int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_8;
ALTER TABLE visitors ADD COLUMN translations int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_9;
```

## Project setup

```bash
$ npm ci
# oder
# npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Infomaniak Shared Hosting

Für ein konkretes Setup (Frontend als statische Dateien + Backend als Node-App hinter `/api`) siehe das Deployment-Kapitel in der Repo-README.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
