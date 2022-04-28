# Matching engine REST API

This engine has 3 endpoints:
`POST /buy`

Sample request
```json
{
	"quantity": "INTEGER_NUMBER",
	"price": "DECIMAL_NUMBER"
}
```

> where "qty" is the number of shares desired and "prc" is the amount user will pay for each share

`POST /sell`

Sample request
```json
{
	"quantity": "INTEGER_NUMBER",
	"price": "DECIMAL_NUMBER"
}
```

> where "qty" is the number of shares willing to sell and "prc" is the amount user is asking for each share

`GET /book`

Sample response

```json
{
	"buys": [ { "qty": "INTEGER_NUMBER", "prc": "DECIMAL_NUMBER" }, ... ],
	"sells":[ { "qty": "INTEGER_NUMBER", "prc": "DECIMAL_NUMBER "}, ... ] 
}
```

> where the remaining portion of each buy and sell from each unmatched order are returned, in sorted order; the buys in descending order by price and the sells in ascending order by price

Stacks used:
- `Express`
- `Postgres`
- `TypeORM`
- `NodeJS`

Steps to run this project:

1. Run `npm i` command
2. Setup database settings inside `data-source.ts` file
3. Run `npm start` command
