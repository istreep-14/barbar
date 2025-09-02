function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'index';
  return HtmlService.createTemplateFromFile(page)
    .evaluate()
    .setTitle('Bar Operations');
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

