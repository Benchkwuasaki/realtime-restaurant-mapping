<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FaceRecognitionService
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeoutSeconds;

    public function __construct()
    {
        $this->baseUrl        = rtrim(config('services.face_api.url', env('FACE_API_URL')), '/');
        $this->apiKey         = (string) config('services.face_api.key', env('FACE_API_KEY', ''));
        $this->timeoutSeconds = (int) config('services.face_api.timeout', 30);
    }

    /**
     * If your FastAPI expects Bearer auth, keep Authorization.
     * If it expects X-API-KEY, swap the header (see comment below).
     */
    private function client(): PendingRequest
    {
        $headers = [
            'Accept' => 'application/json',
        ];

        // OPTION 1: Bearer token
        if ($this->apiKey !== '') {
            $headers['Authorization'] = "Bearer {$this->apiKey}";
        }

        // OPTION 2: If FastAPI uses X-API-KEY instead, use this and remove Authorization:
        // if ($this->apiKey !== '') {
        //     $headers['X-API-KEY'] = $this->apiKey;
        // }

        return Http::withHeaders($headers)->timeout($this->timeoutSeconds);
    }

    /** POST /api/v1/enroll (multipart: image + employee_id) */
    public function enroll(string $employeeId, UploadedFile $image): array
    {
        $response = $this->client()
            ->attach('image', file_get_contents($image->getRealPath()), $image->getClientOriginalName())
            ->post("{$this->baseUrl}/api/v1/enroll", [
                'employee_id' => $employeeId,
            ]);

        return $this->handleResponse($response, 'enroll');
    }

    /** POST /api/v1/identify (multipart: image + top_n) */
    public function identify(UploadedFile $image, int $topN = 5): array
    {
        $response = $this->client()
            ->attach('image', file_get_contents($image->getRealPath()), $image->getClientOriginalName())
            ->post("{$this->baseUrl}/api/v1/identify", [
                'top_n' => $topN,
            ]);

        return $this->handleResponse($response, 'identify');
    }

    public function detect(UploadedFile $image, bool $returnLandmarks = false): array
    {
        $response = $this->client()
            ->attach('image', file_get_contents($image->getRealPath()), $image->getClientOriginalName())
            ->post("{$this->baseUrl}/api/v1/detect", [
                'return_landmarks' => $returnLandmarks ? 'true' : 'false',
            ]);

        return $this->handleResponse($response, 'detect');
    }

    private function handleResponse(Response $response, string $operation): array
    {
        if ($response->successful()) {
            return $response->json() ?? [];
        }

        $body = $response->json();
        $errorCode = data_get($body, 'detail.error_code', 'UNKNOWN_ERROR');
        $message   = data_get($body, 'detail.message', $response->body());

        Log::error("FaceRecognitionService [{$operation}] failed", [
            'status'     => $response->status(),
            'error_code' => $errorCode,
            'message'    => $message,
        ]);

        throw new \RuntimeException("[{$errorCode}] {$message}", $response->status());
    }
}
