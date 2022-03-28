exports.error404 = (req, res, next) => {
  res.status(404).render("errors/page-not-found", {
    pageTitle: "Page Not Found",
    path: "/404",
    isAuthenticated: req.session.isLoggedIn,
  });
};

exports.error500 = (req,res,next) => {
  res.status(500).render('errors/error500', {
    pageTitle: 'ERROR!!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn,
  });
}