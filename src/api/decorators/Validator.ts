import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { ValidationError } from '../errors/ValidationError';

import { createParamDecorator } from 'routing-controllers';

export function ClassValidator(DTO: any, type: string): any {
    return createParamDecorator({
        required: true,
        value: async action => {
            try {
                const body = action.request[type];
                const reqDTO = plainToInstance(DTO, body);
                await validateOrReject(reqDTO, { validationError: { target: false, value: false } });
                return body;
            } catch (err: any) {
                throw new ValidationError('VALIDATION_ERROR', err);
            }
        },
    });
}
