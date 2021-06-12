const EXPORT_NAME_ACTION = 'action';
const EXPORT_NAME_SERVER_LOADER = 'serverLoader';
const EXPORT_NAME_STATIC_LOADER = 'staticLoader';
const EXPORT_NAME_META = 'meta';
const EXPORT_NAME_LOAD_PATHS = 'loadPaths';
const EXPORT_NAME_HEADERS = 'headers';

const ssgExports = new Set([
  EXPORT_NAME_SERVER_LOADER,
  EXPORT_NAME_STATIC_LOADER,
  EXPORT_NAME_ACTION,
  EXPORT_NAME_META,
  EXPORT_NAME_LOAD_PATHS,
  EXPORT_NAME_HEADERS,
]);

function isIdentifierReferenced(ident) {
  const b = ident.scope.getBinding(ident.node.name);
  if (b?.referenced) {
    // Functions can reference themselves, so we need to check if there's a
    // binding outside the function scope or not.
    if (b.path.type === 'FunctionDeclaration') {
      return !b.constantViolations
        .concat(b.referencePaths)
        // Check that every reference is contained within the function:
        .every(ref => ref.findParent(p => p === b.path));
    }

    return true;
  }
  return false;
}

function getIdentifier(path) {
  const parentPath = path.parentPath;
  if (parentPath.type === 'VariableDeclarator') {
    const pp = parentPath;
    const name = pp.get('id');
    return name.node.type === 'Identifier' ? name : null;
  }

  if (parentPath.type === 'AssignmentExpression') {
    const pp = parentPath;
    const name = pp.get('left');
    return name.node.type === 'Identifier' ? name : null;
  }

  if (path.node.type === 'ArrowFunctionExpression') {
    return null;
  }

  return path.node.id && path.node.id.type === 'Identifier'
    ? path.get('id')
    : null;
}

function markFunction(path, state) {
  const ident = getIdentifier(path);
  if (ident?.node && isIdentifierReferenced(ident)) {
    state.refs.add(ident);
  }
}

function markImport(path, state) {
  const local = path.get('local');
  if (isIdentifierReferenced(local)) {
    state.refs.add(local);
  }
}

const isDataIdentifier = (name, state) => {
  if (ssgExports.has(name)) {
    if (name === EXPORT_NAME_SERVER_LOADER) {
      state.isServerProps = true;
    }

    return true;
  }
  return false;
};

module.exports = function ({ types: t }) {
  return {
    name: 'premix-transform',
    visitor: {
      Program: {
        enter(path, state) {
          state.refs = new Set();
          state.isServerProps = false;
          state.done = false;

          path.traverse(
            {
              VariableDeclarator(variablePath, variableState) {
                if (variablePath.node.id.type === 'Identifier') {
                  const local = variablePath.get('id');
                  if (isIdentifierReferenced(local)) {
                    variableState.refs.add(local);
                  }
                } else if (variablePath.node.id.type === 'ObjectPattern') {
                  const pattern = variablePath.get('id');

                  const properties = pattern.get('properties');
                  properties.forEach(p => {
                    const local = p.get(
                      p.node.type === 'ObjectProperty'
                        ? 'value'
                        : p.node.type === 'RestElement'
                        ? 'argument'
                        : (function () {
                            throw new Error('invariant');
                          })()
                    );
                    if (isIdentifierReferenced(local)) {
                      variableState.refs.add(local);
                    }
                  });
                } else if (variablePath.node.id.type === 'ArrayPattern') {
                  const pattern = variablePath.get('id');
                  const elements = pattern.get('elements');
                  elements.forEach(e => {
                    let local;
                    if (e.node?.type === 'Identifier') {
                      local = e;
                    } else if (e.node?.type === 'RestElement') {
                      local = e.get('argument');
                    } else {
                      return;
                    }

                    if (isIdentifierReferenced(local)) {
                      variableState.refs.add(local);
                    }
                  });
                }
              },
              FunctionDeclaration: markFunction,
              FunctionExpression: markFunction,
              ArrowFunctionExpression: markFunction,
              ImportSpecifier: markImport,
              ImportDefaultSpecifier: markImport,
              ImportNamespaceSpecifier: markImport,
              ExportNamedDeclaration(exportNamedPath, exportNamedState) {
                const specifiers = exportNamedPath.get('specifiers');
                if (specifiers.length) {
                  specifiers.forEach(s => {
                    if (
                      isDataIdentifier(
                        t.isIdentifier(s.node.exported)
                          ? s.node.exported.name
                          : s.node.exported.value,
                        exportNamedState
                      )
                    ) {
                      s.remove();
                    }
                  });

                  if (exportNamedPath.node.specifiers.length < 1) {
                    exportNamedPath.remove();
                  }
                  return;
                }

                const decl = exportNamedPath.get('declaration');
                if (decl == null || decl.node == null) {
                  return;
                }

                switch (decl.node.type) {
                  case 'FunctionDeclaration': {
                    const name = decl.node.id.name;
                    if (isDataIdentifier(name, exportNamedState)) {
                      exportNamedPath.remove();
                    }
                    break;
                  }
                  case 'VariableDeclaration': {
                    const inner = decl.get('declarations');
                    inner.forEach(d => {
                      if (d.node.id.type !== 'Identifier') {
                        return;
                      }
                      const name = d.node.id.name;
                      if (isDataIdentifier(name, exportNamedState)) {
                        d.remove();
                      }
                    });
                    break;
                  }
                  default: {
                    break;
                  }
                }
              },
            },
            state
          );
        },
      },
      ExportAllDeclaration(path) {
        const err = new SyntaxError(
          "Using `export * from '...'` in a page is disallowed. Please use `export { default } from '...'` instead.\n"
        );
        err.code = 'BABEL_PARSE_ERROR';
        err.loc = path.node.loc?.start ?? path.node.loc?.end ?? path.node.loc;
        throw err;
      },
    },
  };
};
