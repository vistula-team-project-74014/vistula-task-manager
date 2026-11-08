# Task Manager

A task manager by Alisher Sharofiddinov (Vistula student ID **74014**), built with HTML, CSS and JavaScript. It uses Supabase REST for persistent storage and supports creating, editing, completing, and deleting tasks.

## Links

- Repository: https://github.com/vistula-team-project-74014/vistula-task-manager
- App: https://vistula-team-project-74014.github.io/vistula-task-manager/
- Incoming collaboration pull request: pending Aldiyar's contribution.
- Outgoing collaboration pull request: pending Aldiyar's repository.

## Supabase setup

The demonstration project is configured in `config.json`. The `schema.sql` file creates the `tasks` table and its public CRUD policies. The policies suit only test data: anyone can read, add, change, or delete its tasks. The repository contains only the public Supabase publishable key; never add a secret key or database password.

## GitHub Pages

GitHub Pages serves the repository root from `main`. The partner must provide `contribution.html` and `contribution.json` through a pull request, which the repository owner reviews and merges.
