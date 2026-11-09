<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Данные Twinline: сценарии (общие для руководителей), журнал прогонов и журнал действий безопасности.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scenarios', function (Blueprint $table) {
            $table->string('id', 40)->primary();
            $table->string('name', 80);
            $table->string('description', 240)->default('');
            $table->string('kind', 16)->default('user');
            $table->json('params');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('scenario_runs', function (Blueprint $table) {
            $table->string('id', 40)->primary();
            // Без внешнего ключа: запись прогона сохраняется и после удаления сценария.
            $table->string('scenario_id', 40)->index();
            $table->string('scenario_name', 100);
            $table->timestamp('ran_at')->index();
            $table->double('duration_ms');
            $table->json('summary');
            $table->json('baseline_summary');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('login', 32)->nullable();
            $table->string('action', 48)->index();
            $table->string('subject', 120)->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('scenario_runs');
        Schema::dropIfExists('scenarios');
    }
};
