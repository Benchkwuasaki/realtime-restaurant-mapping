<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'employee_id',
        'embeddings_id',
        'recognition_morning_in_id',
        'recognition_morning_out_id',
        'recognition_afternoon_in_id',
        'recognition_afternoon_out_id',
        'created_at',
    ];
}
