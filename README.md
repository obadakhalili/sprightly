# Sprightly

Template engines like EJS and Handlebars are good. But sometimes you don't want all the code and the complexity that comes with them. You only want a simple variables injection and a partials system. Well, this is what Sprightly is for, its a one-filer that consists of only 45 lines of code, that lets you use those tiny features without having to include or think about anything else.

## Integration With ExpressJS
Since Sprightly is not yet a member of the ExpressJS template engines family. You have to add an extra line of code
```javascript
import express from 'express';
import sprightly from 'sprightly';

const app = express();

app.engine('spy', sprightly); // The one line you have to add
app.set('views', './'); // specify the views directory (its ./views by default)
app.set('view engine', 'spy'); // register the template engine

app.listen(3000, console.log('running'));
```
## Usage
Inject variables in the `res.render()` function, and refer to them using the well known mustache `{{ [key] }}` syntax. If the key is not found in the options object, then empty string `""` is evaluated in its place.
```javascript
app.get('/', (_, res) => {
  res.render('cool.spy', { foo: 'bar' });
});
```
```html
<!DOCTYPE  html>
<html  lang="en">
<head>
	<meta  charset="UTF-8">
	<meta  name="viewport"  content="width=device-width, initial scale=1.0">
	<title>Sprightly is cool like a spy</title>
</head>
<body>
	<h1>{{ foo }}</h1>
	<!-- The above becomes <h1>bar</h1> -->
</body>
</html>
```
### Partials
To inject a partial, just use the following syntax `<< [./path] >>`. The path from inside any `.spy` file should be relative to the root of the views directory. And you should not add the `.spy` extension, it's automatically added for you.

```html
<!DOCTYPE  html>
<html  lang="en">
<head>
	<meta  charset="UTF-8">
	<meta  name="viewport"  content="width=device-width, initial-scale=1.0">
	<title>Sprightly is cool like a spy</title>
</head>
<body>
	<< partials/cool >>
	<!-- the above becomes whatever is inside the cool.spy partial -->
</body>
</html>
```