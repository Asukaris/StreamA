<?php
// Debug script to check routing and PATH_INFO
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

echo json_encode([
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'not set',
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'not set',
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'not set',
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'not set',
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'not set',
    'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'not set',
    'SERVER_NAME' => $_SERVER['SERVER_NAME'] ?? 'not set',
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
    'SCRIPT_FILENAME' => $_SERVER['SCRIPT_FILENAME'] ?? 'not set',
    'PHP_SELF' => $_SERVER['PHP_SELF'] ?? 'not set',
    'REDIRECT_STATUS' => $_SERVER['REDIRECT_STATUS'] ?? 'not set',
    'REDIRECT_URL' => $_SERVER['REDIRECT_URL'] ?? 'not set',
    'GET_params' => $_GET,
    'POST_params' => $_POST,
    'all_headers' => getallheaders(),
    'raw_post_data' => file_get_contents('php://input')
], JSON_PRETTY_PRINT);
?>