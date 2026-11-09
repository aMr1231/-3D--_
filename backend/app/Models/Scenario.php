<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Сценарий параметров линии. Базовый режим хранится в коде фронтенда и в базу не попадает.
 *
 * @property string $id
 * @property string $name
 * @property string $description
 * @property string $kind preset|user
 * @property array $params
 */
#[Fillable(['id', 'name', 'description', 'kind', 'params', 'created_by'])]
class Scenario extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['params' => 'array'];
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'kind' => $this->kind,
            'params' => $this->params,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
