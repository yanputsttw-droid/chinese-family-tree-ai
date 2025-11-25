#!/bin/bash

# Initialize Prisma and run migrations
npx prisma generate
npx prisma migrate dev --name init

echo "Database migration completed successfully!"