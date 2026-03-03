<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FaceEmbedding extends Model
{
    protected $fillable = [
        'employee_id',
        'embeddings',
        'created_at',
    ];
}
