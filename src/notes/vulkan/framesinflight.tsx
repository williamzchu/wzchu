import Code from "../../Code";
import CodeFunc from "../../CodeFunc";

export default function FramesInFlight() {
    return <div>
        Now the biggest flaw about our render loop is that we need to wait for the previous frame before we render the next frame. 
        This idles the host, our CPU while we could be doing work! What we want is to make the rendering of one frame not interfere with recording the next.
        However, any resource that we access and modify while rendering will then have to be duplicated, and we will have multiple command buffers, semaphores, and fences for each frame.

        <p>We start with two frames in flight.
<Code>{`constexpr int MAX_FRAMES_IN_FLIGHT = 2;`}</Code>

We then replace our existing command buffers and synchronization objects with vectors of them, one for each frame.
<Code>{`std::vector<vk::raii::CommandBuffer> commandBuffers;

std::vector<vk::raii::Semaphore> presentCompleteSemaphores;
std::vector<vk::raii::Semaphore> renderFinishedSemaphores;
std::vector<vk::raii::Fence> inFlightFences;

uint32_t currentFrame = 0; // Current frame in flight`}</Code>

We also need a <CodeFunc>semaphoreIndex</CodeFunc>, as the number of images in our swap chain might differ from the amount of images we have in flight. 
Essentially, we have semaphores for each image in our swap chain, and a fence for each image in flight.

<Code>{`uint32_t semaphoreIndex = 0;`}</Code>

We also update how they are created.

<Code>{`void createCommandBuffers() {
    commandBuffers.clear();
    vk::CommandBufferAllocateInfo allocInfo{ .commandPool = commandPool, .level = vk::CommandBufferLevel::ePrimary,
                                           .commandBufferCount = MAX_FRAMES_IN_FLIGHT };
    commandBuffers = vk::raii::CommandBuffers( device, allocInfo );
}

void createSyncObjects()
{
    presentCompleteSemaphores.clear();
    renderFinishedSemaphores.clear();
    inFlightFences.clear();

    for (size_t i = 0; i < swapChainImages.size(); i++)
    {
        presentCompleteSemaphores.emplace_back(device, vk::SemaphoreCreateInfo());
        renderFinishedSemaphores.emplace_back(device, vk::SemaphoreCreateInfo());
    }

    for (size_t i = 0; i < MAX_FRAMES_IN_FLIGHT; i++)
    {
        inFlightFences.emplace_back(device, vk::FenceCreateInfo{.flags = vk::FenceCreateFlagBits::eSignaled});
    }
}`}</Code> 

We then update everywhere else to utilize <CodeFunc>commandBuffers[currentFrame]</CodeFunc>, <CodeFunc>presentCompleteSemaphores[semaphoreIndex]</CodeFunc> and <CodeFunc>renderFinishedSemaphores[semaphoreIndex]</CodeFunc>.

        </p>

    <p>Finally we also increment the frame and semaphore index. 
<Code>{`semaphoreIndex = (semaphoreIndex + 1) % presentCompleteSemaphores.size();
currentFrame = (currentFrame + 1) % MAX_FRAMES_IN_FLIGHT;`}</Code></p>
    </div>
}