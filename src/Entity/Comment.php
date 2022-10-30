<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post as MethodPost;
use ApiPlatform\Metadata\Put;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

use function Symfony\Component\String\u;
use Symfony\Component\Validator\Constraints as Assert;
use App\Controller\Api\CommentCreateController;

/**
 * Defines the properties of the Comment entity to represent the blog comments.
 * See https://symfony.com/doc/current/doctrine.html#creating-an-entity-class.
 *
 * Tip: if you have an existing database, you can generate these entity class automatically.
 * See https://symfony.com/doc/current/doctrine/reverse_engineering.html
 *
 * @author Ryan Weaver <weaverryan@gmail.com>
 * @author Javier Eguiluz <javier.eguiluz@gmail.com>
 */
#[ORM\Entity]
#[ORM\Table(name: 'symfony_demo_comment')]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: [
                'groups' => ['read::full::comment', 'read::comment']
            ]
        ),
        new GetCollection(),
        new MethodPost(
            controller: CommentCreateController::class,
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
            denormalizationContext: ["groups" => "create::comment"]
        ),
        new Put(
            security: "is_granted('EDIT_COMMENT', object)",
            denormalizationContext: ["groups" => "update::comment"]
        ),
        new Delete(
            security: "is_granted('EDIT_COMMENT', object)"
        )
    ],
    normalizationContext: [
        "groups" => ["read::comment"]
    ],
    order: ["publishedAt" => "desc"],
    paginationItemsPerPage: 2,
)]
#[ApiFilter(SearchFilter::class, properties:['post' => 'exact'])]
class Comment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(["read::comment"])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Post::class, inversedBy: 'comments')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(["read::full::comment", 'create::comment'])]
    private ?Post $post = null;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank(message: 'comment.blank')]
    #[Assert\Length(min: 5, minMessage: 'comment.too_short', max: 10000, maxMessage: 'comment.too_long')]
    #[Groups(['read::comment', 'update::comment', 'create::comment'])]
    private ?string $content = null;

    #[ORM\Column(type: 'datetime')]
    #[Groups(["read::comment"])]
    private \DateTime $publishedAt;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(["read::comment"])]
    private ?User $author = null;

    public function __construct()
    {
        $this->publishedAt = new \DateTime();
    }

    #[Assert\IsTrue(message: 'comment.is_spam')]
    public function isLegitComment(): bool
    {
        $containsInvalidCharacters = null !== u($this->content)->indexOf('@');

        return !$containsInvalidCharacters;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): void
    {
        $this->content = $content;
    }

    public function getPublishedAt(): \DateTime
    {
        return $this->publishedAt;
    }

    public function setPublishedAt(\DateTime $publishedAt): void
    {
        $this->publishedAt = $publishedAt;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(User $author): void
    {
        $this->author = $author;
    }

    public function getPost(): ?Post
    {
        return $this->post;
    }

    public function setPost(Post $post): void
    {
        $this->post = $post;
    }
}
