# node-jwt-api-base
Basic structure for a JWT based api using Node.js


Adapted from [Hackathon Starter](https://github.com/sahat/hackathon-starter)

## API routes

| Method | URL                       | Params/Headers                                                                                         | Description                                             |
|--------|---------------------------|--------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| POST   | /login                    | { "email": "test@mail.com", "password": "Password01" }                                                 | Returns Auth Token                                      |
| POST   | /signup                   | { "email": "superuser@mail.com", "password": "Password01", "confirmPassword": "Password01"}            | Returns auth token                                      |
| GET    | /account/profile          | Authorization Header: 'Bearer [JWT Here]'                                                              | Returns profile data                                    |
| POST   | /account/password         | { "password": "Password01", "confirmPassword": "Password01"} Authorization Header: 'Bearer [JWT Here]' | Changes users password to the one provided in params    |
| POST   | /account/delete           | Authorization Header: 'Bearer [JWT Here]'                                                              | Deletes user's account                                  |
| GET    | /account/unlink/:provider | Authorization Header: 'Bearer [JWT Here]' *provider param in url*                                      | Removes a social provider from user's account           |
| GET    | /auth/facebook            |                                                                                                        | Call to authenticate a user with their Facebook account |
| GET    | /auth/facebook/callback   |                                                                                                        | Callback url for Facebook                               |
| GET    | /token                    | Authorization Header: 'Bearer [JWT Here]'                                                              | Returns refresh token                                   |
| POST   | /token/refresh            | {"id": "55555AAAABBBCCC55555","refreshToken": "1.3248ybuhfewg87gf87g9329ed"}                           | Return auth token                                       |
| POST   | /token/revoke             | {"id": "55555AAAABBBCCC55555","refreshToken": "1.3248ybuhfewg87gf87g9329ed"}                           | Revokes specified refresh token                         |
