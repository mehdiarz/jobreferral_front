// Basic validation functions that return validation functions
export const required = (errorMessage: string = 'این فیلد الزامی است') =>
    ({ value }: { value: string | number | null | undefined }): string | undefined => {
        if (value === null || value === undefined) {
            return errorMessage
        }
        if (typeof value === 'string' && value.trim().length === 0) {
            return errorMessage
        }
        if (typeof value === 'number' && value === 0) {
            return errorMessage
        }
        return undefined
    }

export const email = (errorMessage: string = 'ایمیل معتبر نیست') => ({ value }: {
    value: string
}): string | undefined => {
    if (!value) return undefined // Let required handle empty values
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return !emailRegex.test(value) ? errorMessage : undefined
}

export const phone = (errorMessage: string = 'شماره موبایل باید با 0 شروع شده و 11 رقم باشد') => ({ value }: {
    value: string
}): string | undefined => {
    if (!value) return undefined // Let required handle empty values
    const phoneRegex = /^0\d{10}$/
    return !phoneRegex.test(value) ? errorMessage : undefined
}

export const positiveNumber = (errorMessage: string = 'مقدار باید عدد مثبت باشد') => ({ value }: {
    value: string
}): string | undefined => {
    if (!value) return undefined // Let required handle empty values
    const num = Number(value)
    return isNaN(num) || num < 0 ? errorMessage : undefined
}

export const minLength = (min: number, errorMessage?: string) => ({ value }: { value: string }): string | undefined => {
    if (!value) return undefined // Let required handle empty values
    const message = errorMessage || `حداقل ${min} کاراکتر الزامی است`
    return value.length < min ? message : undefined
}

export const maxLength = (max: number, errorMessage?: string) => ({ value }: { value: string }): string | undefined => {
    if (!value) return undefined // Let required handle empty values
    const message = errorMessage || `حداکثر ${max} کاراکتر مجاز است`
    return value.length > max ? message : undefined
}

export const exactLength = (length: number, errorMessage?: string) => ({ value }: {
    value: string
}): string | undefined => {
    if (!value) return undefined // Let required handle empty values
    const message = errorMessage || `دقیقاً ${length} کاراکتر الزامی است`
    return value.length !== length ? message : undefined
}

// Combine multiple validations
export const combineValidations = (...validations: (({ value }: { value: string }) => string | undefined)[]) => {
    return ({ value }: { value: string }): string | undefined => {
        for (const validation of validations) {
            const result = validation({ value })
            if (result) {
                return result
            }
        }
        return undefined
    }
}

// Predefined validation combinations
export const requiredEmail = (requiredMessage: string, emailMessage: string) =>
    combineValidations(required(requiredMessage), email(emailMessage))

export const requiredPhone = (requiredMessage: string, phoneMessage: string) =>
    combineValidations(required(requiredMessage), phone(phoneMessage))

export const requiredPositiveNumber = (requiredMessage: string, numberMessage: string) =>
    combineValidations(required(requiredMessage), positiveNumber(numberMessage))

export const requiredMinLength = (min: number, requiredMessage: string, lengthMessage?: string) =>
    combineValidations(required(requiredMessage), minLength(min, lengthMessage))

export const requiredMaxLength = (max: number, requiredMessage: string, lengthMessage?: string) =>
    combineValidations(required(requiredMessage), maxLength(max, lengthMessage))

export const requiredExactLength = (length: number, requiredMessage: string, lengthMessage?: string) =>
    combineValidations(required(requiredMessage), exactLength(length, lengthMessage))