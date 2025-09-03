
## Project setup

```bash
$ pnpm install
```

## Migrate database
```bash
$ prisma migrate dev --name init
```

## Prisma generate
```bash
$ prisma generate
```


## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```