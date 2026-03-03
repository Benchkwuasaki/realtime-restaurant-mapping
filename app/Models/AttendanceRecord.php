<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'employee_id',
        'embeddings_id',
        'status',
        'img_path',
        'date',
        'duration',
        'created_at',
    ];
}
