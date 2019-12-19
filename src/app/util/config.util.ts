import { ValueSpec, ValueSpecList, AppConfigSpec, WithStandalone, ListValueSpecObject, ListValueSpecString, ListValueSpecEnum, ValueSpecString, ValueSpecEnum, ValueSpecBoolean, DefaultString } from '../models/s9-app'
import * as cryptoUtil from './crypto.util'
const MAX_ENTROPY = 100

export function mapSpecToConfigValue (spec: ValueSpec, value: any): any {
  // if value is null and spec is not nullable, mark invalid and return
  if (value === null) {
    if (!(spec as WithStandalone).nullable) {
      spec.invalid = true
    }
    return value
  }

  switch (spec.type) {
    case 'object':
      return mapSpecToConfigObject(spec, value)
    case 'string':
      return mapSpecToConfigString(spec, value)
    case 'list':
      return mapSpecToConfigList(spec, value)
    case 'enum':
      return mapSpecToConfigEnum(spec, value)
    default:
      return value
  }
}

export function mapSpecToConfigObject (spec: ListValueSpecObject, value = { }): object {
  if (typeof value !== 'object' || Array.isArray(value)) {
    console.log('not an object', spec, value)
    spec.invalid = true
    return value
  }

  const objectSpec = spec.spec

  Object.entries(objectSpec).map(([key, val]) => {
    const configVal = value[key]
    if (configVal === undefined) {
      value[key] = getDefaultConfigValue(val)
      val.added = true
    } else {
      value[key] = mapSpecToConfigValue(val, configVal)
    }
    if (val.added) {
      spec.added = true
    }
    if (val.invalid) {
      spec.invalid = true
    }
  })

  return value
}

export function mapSpecToConfigString (spec: ListValueSpecString, value: string): string {
  if (typeof value !== 'string') {
    console.log('not a string: ', spec, value)
    spec.invalid = true
    return value
  }

  const pattern = spec.pattern

  if (pattern && !RegExp(pattern.regex).test(value)) {
    spec.invalid = true
  }

  return value
}

export function mapSpecToConfigEnum (spec: ListValueSpecEnum, value: string) {
  if (typeof value !== 'string') {
    console.log('not an enum: ', spec, value)
    spec.invalid = true
    return value
  }

  if (!spec.values.includes(value)) {
    spec.invalid = true
  }

  return value
}

export function mapSpecToConfigList (spec: ValueSpecList, value: string[] | object[]): string[] | object[] {
  if (!Array.isArray(value)) {
    console.log('not an array', spec, value)
    spec.invalid = true
    return value
  }

  const listSpec = spec.spec

  let fn: (val: object | string) => string | object = () => ({ })
  switch (listSpec.type) {
    case 'object':
      fn = (val: object) => mapSpecToConfigObject(listSpec, val)
      break
    case 'string':
      fn = (val: string) => mapSpecToConfigString(listSpec, val)
      break
    case 'enum':
      fn = (val: string) => mapSpecToConfigEnum(listSpec, val)
      break
  }
  // map nested values
  value.forEach((val: string | object, i: number) => {
    value[i] = fn(val)
  })
  // * MUT * add list elements until min satisfied
  getDefaultList(spec, value)

  return value
}

export function getDefaultConfigValue (spec: ValueSpec): object | string | object[] | string[] | boolean | null {
  if (spec.type !== 'list' && spec.type !== 'boolean' && spec.nullable) {
    return null
  }

  switch (spec.type) {
    case 'object':
      return getDefaultObject(spec.spec)
    case 'string':
      return getDefaultString(spec.default!)
    case 'list':
      return getDefaultList(spec)
    case 'enum':
      return getDefaultEnum(spec.default!)
    case 'boolean':
      return getDefaultBoolean(spec.default)
  }
}

export function getDefaultObject (spec: AppConfigSpec): object {
  const obj = { }
  Object.entries(spec).map(([key, val]) => {
    obj[key] = getDefaultConfigValue(val)
  })

  return obj
}

export function getDefaultListString (defaultVal: string | DefaultString, i: number): string {
  if (typeof defaultVal === 'string') {
    return defaultVal
  } else {
    const [min, max] = defaultVal.length.split('..').map(Number)
    const length = cryptoUtil.getRandomNumberInRange(min, max || MAX_ENTROPY)
    let s = ''
    for (let i = 0; i < length; i++) {
      s = s + cryptoUtil.getRandomCharInSet(defaultVal.charset)
    }

    return s
  }
}

export function getDefaultString (defaultVal: string | DefaultString): string {
  if (typeof defaultVal === 'string') {
    return defaultVal
  } else {
    const [min, max] = defaultVal.length.split('..').map(Number)
    const length = cryptoUtil.getRandomNumberInRange(min, max || MAX_ENTROPY)
    let s = ''
    for (let i = 0; i < length; i++) {
      s = s + cryptoUtil.getRandomCharInSet(defaultVal.charset)
    }

    return s
  }
}

export function getDefaultEnum (defaultVal: string): string {
  return defaultVal
}

export function getDefaultBoolean (defaultVal: boolean): boolean {
  return defaultVal
}

export function getDefaultList (spec: ValueSpecList, list: any[] = []): object[] | string[] {
  const listSpec = spec.spec

  let fn: (i: number) => string | object = () => ({ })
  switch (listSpec.type) {
    case 'object':
      fn = () => getDefaultObject(listSpec.spec)
      break
    case 'string':
      fn = (i: number) => getDefaultString(spec.default[i] as string | DefaultString)
      break
    case 'enum':
      fn = (i: number) => getDefaultEnum(spec.default[i] as string)
      break
  }

  for (let i = list.length; i < Number(spec.length.split('..')[0]); i++) {
    list.push(fn(i))
  }

  return list
}