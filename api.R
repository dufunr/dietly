library(plumber)
library(DBI)
library(RMySQL)

# CORS filter
#* @filter cors
cors <- function(req, res){
  res$setHeader("Access-Control-Allow-Origin", "*")
  plumber::forward()
}

# DB connection
con <- dbConnect(
  RMySQL::MySQL(),
  dbname = "dietly",
  host = "localhost",
  user = "root",
  password = "root"
)

#* Subscriptions per plan
#* @get /subscriptions
function() {
  dbGetQuery(con, "
    SELECT sp.name AS plan_name, COUNT(s.subscription_id) AS count
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_type = sp.subscription_id
    GROUP BY sp.name
  ")
}

#* Meals per diet type
#* @get /diet-plans
function() {
  dbGetQuery(con, "
    SELECT diet_type, COUNT(meal_id) AS count
    FROM meals
    GROUP BY diet_type
  ")
}

#* Weekly new subscribers
#* @get /weekly-subs
function() {
  dbGetQuery(con, "
    SELECT WEEK(start_date) AS week, COUNT(subscription_id) AS new_subs
    FROM subscriptions
    GROUP BY WEEK(start_date)
    ORDER BY week
  ")
}
