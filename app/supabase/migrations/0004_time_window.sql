-- Replace max_hours with a start/end time window (hour of day, 0-23).
alter table groups add column if not exists start_hour int not null default 12;
alter table groups add column if not exists end_hour   int not null default 22;
-- max_hours is kept so old rows don't break; new code ignores it.
