<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeUploadedFile extends Model
{
    protected $table = 'employee_uploaded_files';
    protected $primaryKey = 'id';

    protected $fillable = [
        'employee_id',
        'file_name',
        'file_path',
        'file_size',
        'file_url',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}