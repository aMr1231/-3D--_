<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PasswordChangeRequest extends FormRequest
{
    public function rules(): array
    {
        $login = (string) $this->user()?->login;

        return [
            'currentPassword' => ['required', 'string', 'current_password'],
            'newPassword' => [
                'required', 'string', 'min:8', 'max:128',
                'regex:/\pL/u', 'regex:/\d/',
                function (string $attribute, mixed $value, \Closure $fail) use ($login) {
                    if ($login !== '' && str_contains(mb_strtolower((string) $value), $login)) {
                        $fail('Пароль не должен содержать логин.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'currentPassword.required' => 'Введите текущий пароль.',
            'currentPassword.current_password' => 'Текущий пароль указан неверно.',
            'newPassword.required' => 'Введите новый пароль.',
            'newPassword.min' => 'Пароль должен быть не короче 8 символов.',
            'newPassword.max' => 'Пароль должен быть не длиннее 128 символов.',
            'newPassword.regex' => 'Пароль должен содержать буквы и цифры.',
        ];
    }
}
