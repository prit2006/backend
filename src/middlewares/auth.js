const adminAuth=(req, res, next) =>{
    const token = "999";
    const isAuthorizedAdmin = token === "999";
    if (!isAuthorizedAdmin) {
        res.status(401).send("Unauthorized Admin");
    } else {
        next();
    }
}
const userAuth=(req, res, next) =>{
    const token = "123";
    const isAuthorizedUser = token === "123";
    if (!isAuthorizedUser) {
        res.status(401).send("Unauthorized User");      
    } else {
        next();
    }
}
module.exports={adminAuth, userAuth};