# Technologies Overview

## Frontend

A decision was made to use Vue for the frontend due to the large adoption on BC Gov projects, alongside Typescript. Once Vue was the selected option there were ponderations about start the project using Vue 2 vs Vue 3, where the final decision was to start with Vue 3.

The Open Source UI library Vuetify 3 is being used to deliver out of the box customizable, responsive components.

Please find below some references to the main technologies being used on the application Frontend.

- Vuejs: v3 (<https://v3.vuejs.org/>)
- Vuetify: v3 (<https://vuetifyjs.com/en/>)
- Vee-validate: v4 (<https://vee-validate.logaretm.com/v3>)
- Typescript: <https://www.typescriptlang.org/>

## Backend

A decision was made to use technologies based on Node for the backend due to the large adoption on BC Gov projects, alongside Typescript.
On top of Node, the project is using the Nestjs framework because it provides an out of box set of patterns and good practices that could be used as a great starting point, which means that, if we need a solution for a particular problem we can take a look first on Nestjs docs to ensure that it was not already being solved by the framework.

Please find below some references to the main technologies being used on the application backend.

- Node: v16 (<https://nodejs.org/en/>)
- Nestjs: v7 (<https://docs.nestjs.com/>)
- Typescript: <https://www.typescriptlang.org/>

### Database

A decision was made to use PostgreSQL as the main database for the project due to the large adoption on BC Gov projects. Alongside PostgreSQL, Crunchy was adopted to provide a high availability database support.

Please find below some references to the main database related tecnologies being used on application backend.

- PostgreSQL: <https://www.postgresql.org/>
- TypeORM: <https://typeorm.io/>
- Crunchy: <https://access.crunchydata.com/documentation/postgres-operator/latest/installation/helm>
