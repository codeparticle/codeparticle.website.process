const fs = require('fs');
const toCamelCase = require('./toCamelCase');

// fileType should be actions | reducers | selectors | types and should be a file name in src/rdx
const integrateDuck = (duckName, fileType) => {
  const camelDuck = toCamelCase(duckName);
  let varName = camelDuck;
  switch (fileType) {
    case 'actions':
      varName += 'Actions';
      break;
    case 'reducers':
      varName += 'Reducers';
      break;
    case 'selectors':
      varName += 'Selectors';
      break;
    case 'types':
      varName += 'Types';
      break;
    case 'sagas': {
      const firstLetter = varName.charAt(0).toUpperCase();
      const pascalVarName = (firstLetter + varName.slice(1));
      varName = `watch${pascalVarName}Sagas`;
    }
      break;
    default:
      console.warn(`Bad fileType ${fileType} for duck module integration`);
      return;
  }
  const pathToFile = `./src/rdx/${fileType}.js`;
  const file = fs.readFileSync(pathToFile).toString();
  // integrate into 1) importation && 2) conglomerate object
  const insertionIndex = file.search(/\/\/\sINSERTION_PT/);
  const importationIndex = file.search(/\/\/\sIMPORT_PT/);
  if (insertionIndex < 0 || importationIndex < 0) {
    console.warn(` error searching for "IMPORT_PT" or "INSERTION_PT" landmarks.\nSee ${pathToFile}.`);
    return;
  }
  const newImportLine = `import ${varName} from 'rdx/modules/${camelDuck}/${fileType}';\n`
  const newInsertionLine = fileType === 'sagas'
    ? `${varName}(),\n    `
    : `  ...${varName},\n`
  const newFile = file.slice(0, importationIndex)
    .concat(newImportLine)
    .concat(file.slice(importationIndex, insertionIndex))
    .concat(newInsertionLine)
    .concat(file.slice(insertionIndex, file.length));


  fs.writeFile(pathToFile, newFile, (err) => {
    if (err) {
      console.warn(`ERROR writing to rdx/${fileType}.js file`);
    }
  });
  console.log(`SUCCESS integrating ${duckName} into redux ${fileType} conglomerate`);
}

module.exports = integrateDuck;
