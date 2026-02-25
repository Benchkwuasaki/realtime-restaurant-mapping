<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeUploadedFile extends Model
{
    protected $primaryKey = 'uploaded_file_id';

    protected $fillable = [
        'employee_id',
        'file_name',
        'file_size',
        'file_database_location',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}