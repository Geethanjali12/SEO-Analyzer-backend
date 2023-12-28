const express = require('express');
const seoRoutes = require('./routes/SeoRoute');
// const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.use(express.json());

// async function connectDB() {
//     await mongoose.connect('mongodb://localhost:27017/seo', {
//        useNewUrlParser: true,
//        useUnifiedTopology: true,
//        connectTimeoutMS: 30000,
//    });   
// }
  
// connectDB();
app.use('/', seoRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
