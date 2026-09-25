<?php
$config = require __DIR__ . '/config.php';
$conn = new mysqli($config['host'], $config['user'], $config['pass'], $config['name']);
