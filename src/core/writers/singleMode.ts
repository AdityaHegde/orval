import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { OutputOptions } from '../../types';
import { WriteSpecsProps } from '../../types/writers';
import { camel } from '../../utils/case';
import { getFileInfo } from '../../utils/file';
import { isObject, isString } from '../../utils/is';
import { getFilesHeader } from '../../utils/messages/inline';
import { generateClientImports } from '../generators/client';
import { generateImports, generateMutatorImports } from '../generators/imports';
import { generateModelsInline } from '../generators/modelsInline';
import { resolvePath } from '../resolvers/path';
import { generateTarget } from './target';

export const writeSingleMode = ({
  workspace,
  operations,
  schemas,
  info,
  output,
}: WriteSpecsProps & { workspace: string; output: string | OutputOptions }) => {
  const targetedPath = isString(output) ? output : output.target || '';
  const { path, dirname } = getFileInfo(
    join(workspace, targetedPath),
    camel(info.title),
  );

  if (!existsSync(dirname)) {
    mkdirSync(dirname);
  }

  const {
    imports,
    implementation,
    implementationMSW,
    mutators,
  } = generateTarget(operations, info, isObject(output) ? output : undefined);

  let data = getFilesHeader(info);

  const defaultImports = generateClientImports(
    isObject(output) ? output.client : undefined,
  );

  if (isObject(output) && output.mock) {
    data += defaultImports.implementation;
    data += defaultImports.implementationMSW;
  } else {
    data += defaultImports.implementation;
  }

  if (isObject(output) && output.schemas) {
    data += generateImports(
      imports,
      resolvePath(output.target || '', output.schemas),
      true,
    );
  } else {
    data += generateModelsInline(schemas);
  }

  if (mutators) {
    data += generateMutatorImports(mutators);
  }

  data += `\n\n${implementation}`;

  if (isObject(output) && output.mock) {
    data += '\n\n';
    data += implementationMSW;
  }

  writeFileSync(path, data);
};
