# NASA_imageOfTheDay
## what it does
This application prompts the user to enter a date for which they want to see the NASA image of the day. The image is displayed along with additional information, and added to a database for quicker access. Users can search for new dates, or search for dates they've already seen. Users can also clear their search history so all dates are unseen.
## how it works
This application is written in JS and HTML. It uses express endpoints to fetch information from NASA's API. It uses ejs to display the information, and mongoDB to store already-seen images.
