const config = {
    endpoint: "https://mercedesf1-nosql.documents.azure.com:443/",
    key: "HvTNZnNiIxnAUBqajWOYkTEyuSRD9EeIQBa6kYBqlxWY0PEeAJbyNPvT8CzXAkzFGtcqSsVTi7wF3qYew1Fx0Q==",
    databaseId: "TeamMemberTravel",
    containerId: "User",
    partitionKey: { kind: "Hash", paths: ["/email"] }
  };
  
  module.exports = config;