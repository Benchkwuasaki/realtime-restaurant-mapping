<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecognitionLog extends Model
{
    protected $fillable = [
        'employee_id',
        'action_type',
        'recognition_status',
        'confidence_score',
        'similarity_threshold',
        'processing_time_ms',
        'metadata',
        'created_at',
    ];
}
