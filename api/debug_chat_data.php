<?php
header('Content-Type: application/json');
echo json_encode([
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'not set',
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'not set',
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'not set',
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'not set'
]);
?>