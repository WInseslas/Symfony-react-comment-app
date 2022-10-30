<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class EmptyController extends AbstractController{

    public function __invoke()
    {
        return new Response(); 
    }

}