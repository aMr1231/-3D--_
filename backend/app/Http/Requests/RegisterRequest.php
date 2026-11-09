<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Регистрация: только логин и пароль (без ФИО и контактов — 152-ФЗ).
 */
class RegisterRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['login' => mb_strtolower(trim((string) $this->input('login')))]);
    }

    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'regex:/^[a-z0-9][a-z0-9._-]{2,31}$/', 'unique:users,login'],
            'password' => [
                'required', 'string', 'min:8', 'max:128',
                'regex:/\pL/u', 'regex:/\d/',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $login = (string) $this->input('login');
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
            'login.required' => 'Введите логин.',
            'login.regex' => 'Логин: 3–32 символа — латинские буквы, цифры, точка, дефис или подчёркивание; начинается с буквы или цифры.',
            'login.unique' => 'Этот логин уже занят.',
            'password.required' => 'Введите пароль.',
            'password.min' => 'Пароль должен быть не короче 8 символов.',
            'password.max' => 'Пароль должен быть не длиннее 128 символов.',
            'password.regex' => 'Пароль должен содержать буквы и цифры.',
        ];
    }
}
