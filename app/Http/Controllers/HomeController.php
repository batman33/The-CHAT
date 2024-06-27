<?php

namespace App\Http\Controllers;

class HomeController extends Controller {
    public function home(): \Inertia\Response|\Inertia\ResponseFactory {
        return inertia('Home');
    }
}
