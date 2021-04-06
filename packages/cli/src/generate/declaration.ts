import {
  ClarityAbiType,
  isClarityAbiBuffer,
  isClarityAbiList,
  isClarityAbiOptional,
  isClarityAbiPrimitive,
  isClarityAbiResponse,
  isClarityAbiStringAscii,
  isClarityAbiStringUtf8,
  isClarityAbiTuple,
} from '@stacks/transactions';
import { toCamelCase, ClarityAbi } from '@clarion/core';

export const cvFromType = (val: ClarityAbiType) => {
  if (isClarityAbiPrimitive(val)) {
    if (val === 'uint128') {
      return 'ClarityTypes.UIntCV';
    } else if (val === 'int128') {
      return 'ClarityTypes.IntCV';
    } else if (val === 'bool') {
      return 'ClarityTypes.BooleanCV';
    } else if (val === 'principal') {
      return 'ClarityTypes.PrincipalCV';
    } else if (val === 'none') {
      return 'ClarityTypes.NoneCV';
    } else {
      throw new Error(
        `Unexpected Clarity ABI type primitive: ${JSON.stringify(val)}`
      );
    }
  } else if (isClarityAbiBuffer(val)) {
    return 'ClarityTypes.BufferCV';
  } else if (isClarityAbiResponse(val)) {
    return 'ClarityTypes.ResponseCV';
  } else if (isClarityAbiOptional(val)) {
    return 'ClarityTypes.OptionalCV';
  } else if (isClarityAbiTuple(val)) {
    return 'ClarityTypes.TupleCV';
  } else if (isClarityAbiList(val)) {
    return 'ClarityTypes.ListCV';
  } else if (isClarityAbiStringAscii(val)) {
    return 'ClarityTypes.StringAsciiCV';
  } else if (isClarityAbiStringUtf8(val)) {
    return 'ClarityTypes.StringUtf8CV';
  } else {
    throw new Error(`Unexpected Clarity ABI type: ${JSON.stringify(val)}`);
  }
};

export const jsTypeFromAbiType = (val: ClarityAbiType): string => {
  if (isClarityAbiPrimitive(val)) {
    if (val === 'uint128') {
      return 'number';
    } else if (val === 'int128') {
      return 'number';
    } else if (val === 'bool') {
      return 'boolean';
    } else if (val === 'principal') {
      return 'string';
    } else if (val === 'none') {
      return 'null';
    } else if (val === 'trait_reference') {
      return 'string';
    } else {
      throw new Error(
        `Unexpected Clarity ABI type primitive: ${JSON.stringify(val)}`
      );
    }
  } else if (isClarityAbiBuffer(val)) {
    return 'Buffer';
  } else if (isClarityAbiResponse(val)) {
    const ok: any = jsTypeFromAbiType(val.response.ok);
    const err: any = jsTypeFromAbiType(val.response.error);
    return `ClarityTypes.Response<${ok}, ${err}>`;
  } else if (isClarityAbiOptional(val)) {
    const innerType = jsTypeFromAbiType(val.optional);
    return `${innerType} | null`;
  } else if (isClarityAbiTuple(val)) {
    return 'ClarityTypes.TupleCV';
  } else if (isClarityAbiList(val)) {
    const innerType: any = jsTypeFromAbiType(val.list.type);
    return `${innerType}[]`;
  } else if (isClarityAbiStringAscii(val)) {
    return 'string';
  } else if (isClarityAbiStringUtf8(val)) {
    return 'string';
  } else if (val === 'trait_reference') {
    return 'string';
  } else {
    throw new Error(`Unexpected Clarity ABI type: ${JSON.stringify(val)}`);
  }
};

export const makeTypes = (abi: ClarityAbi) => {
  let typings = '';
  abi.functions.forEach((func, index) => {
    if (func.access === 'private') return;
    let functionLine = `${toCamelCase(func.name)}: `;
    const args = func.args.map((arg) => {
      return `${toCamelCase(arg.name)}: ${jsTypeFromAbiType(arg.type)}`;
    });
    functionLine += `(${args.join(', ')}) => `;
    if (func.access === 'public') {
      const { type } = func.outputs;
      if (!isClarityAbiResponse(type))
        throw new Error('Expected response type for public function');
      functionLine += 'Transaction';
      const ok = jsTypeFromAbiType(type.response.ok);
      const err = jsTypeFromAbiType(type.response.error);
      functionLine += `<${ok}, ${err}>;`;
    } else {
      const jsType = jsTypeFromAbiType(func.outputs.type);
      functionLine += `Promise<${jsType}>;`;
      // const { type } = func.outputs;
      // if (isClarityAbiResponse(type)) {
      //   const ok = jsTypeFromAbiType(type.response.ok);
      //   const err = jsTypeFromAbiType(type.response.error);
      //   functionLine += `Promise<ClarityTypes.Response<${ok}, ${err}>>;`;
      // } else {
      //   const jsType = jsTypeFromAbiType(func.outputs.type);
      //   functionLine += `Promise<${jsType}>;`;
      // }
    }
    typings += `${index === 0 ? '' : '\n'}  ${functionLine}`;
  });

  return typings;
};