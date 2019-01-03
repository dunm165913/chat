const jwt=require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      // console.log(token+"----");
      const decoded = jwt.verify(token,"chatserver");
      //  console.log(decoded);
      req.userData = decoded;
      next();
    } catch (err) { // thao luan xem redirect sang dau ( co the la '/' )
      next();
    }
  };
  